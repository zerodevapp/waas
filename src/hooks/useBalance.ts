import {
  QueryFunction,
  QueryFunctionContext,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import {
  ContractFunctionExecutionError,
  createPublicClient,
  formatUnits,
  hexToString,
  http,
  trim,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
} from "viem";
import { useZeroDevConfig } from "../providers/ZeroDevAppContext";
import { useKernelClient } from "./useKernelClient";

export type UseBalanceParameters = {
  address?: Address;
  tokenAddress?: Address;
};

export type GetTokenBalanceParameters = {
  symbolType: "string" | "bytes32";
  publicClient: PublicClient;
  address: Address;
  tokenAddress: Address;
};

export type BalanceKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    chain: Chain | undefined | null;
    parameters: UseBalanceParameters;
  }
];

export type GetBalanceReturnType = {
  value: bigint;
  decimals: number;
  symbol: string;
  formatted: string;
};

export type UseBalanceReturnType = UseQueryResult<
  GetBalanceReturnType,
  unknown
>;

async function getTokenBalance(
  parameters: GetTokenBalanceParameters
): Promise<GetBalanceReturnType> {
  const { tokenAddress, address, symbolType, publicClient } = parameters;
  const contract = {
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ type: "address" }],
        outputs: [{ type: "uint256" }],
      },
      {
        type: "function",
        name: "decimals",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint8" }],
      },
      {
        type: "function",
        name: "symbol",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: symbolType }],
      },
    ],
    address: tokenAddress,
  };

  const [value, decimals, symbol] = await Promise.all(
    [
      {
        ...contract,
        functionName: "balanceOf",
        args: [address],
      },
      { ...contract, functionName: "decimals" },
      { ...contract, functionName: "symbol" },
    ].map((contract) => publicClient.readContract(contract))
  );
  const formatted = formatUnits(value as bigint, decimals as number);

  return {
    decimals: decimals as number,
    formatted,
    symbol: symbol as string,
    value: value as bigint,
  };
}

async function getBalanceQueryFn({
  queryKey,
}: QueryFunctionContext<BalanceKey>): Promise<GetBalanceReturnType> {
  const [_key, { parameters, appId, chain }] = queryKey;
  const { address, tokenAddress } = parameters;

  if (!address) {
    throw new Error("Address is required");
  }
  const publicClient = createPublicClient({
    chain: chain!,
    transport: http(`https://rpc.zerodev.app/api/v2/bundler/${appId!}`),
  });
  if (tokenAddress) {
    try {
      return await getTokenBalance({
        address: address,
        publicClient,
        symbolType: "string",
        tokenAddress,
      });
    } catch (error) {
      // In the chance that there is an error upon decoding the contract result,
      // it could be likely that the contract data is represented as bytes32 instead
      // of a string.
      if (error instanceof ContractFunctionExecutionError) {
        const balance = await getTokenBalance({
          address: address,
          publicClient,
          symbolType: "bytes32",
          tokenAddress,
        });
        const symbol = hexToString(
          trim(balance.symbol as Hex, { dir: "right" })
        );
        return { ...balance, symbol };
      }
      throw error;
    }
  }
  const balance = await publicClient.getBalance({
    address: address,
  });

  return {
    value: balance,
    decimals: chain!.nativeCurrency.decimals,
    symbol: chain!.nativeCurrency.symbol,
    formatted: formatUnits(balance, chain!.nativeCurrency.decimals),
  };
}

export function useBalance(
  parameters: UseBalanceParameters = {}
): UseBalanceReturnType {
  const { appId, chain } = useZeroDevConfig();
  const { address: kernelAddress } = useKernelClient();

  if (!parameters.address) {
    parameters.address = kernelAddress;
  }

  return useQuery({
    queryKey: [
      "balance",
      {
        parameters,
        appId,
        chain,
      },
    ],
    queryFn: getBalanceQueryFn as unknown as QueryFunction<any>,
    enabled: !!appId || !!chain,
  });
}
