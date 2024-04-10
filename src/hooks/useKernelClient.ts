import {
  QueryFunction,
  QueryFunctionContext,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import {
  KernelAccountClient,
  KernelSmartAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  gasTokenAddresses
} from "@zerodev/sdk";
import { bundlerActions } from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { type EntryPoint } from "permissionless/types";
import { createClient, http, type Chain, type PublicClient, type Address, type Transport } from "viem";
import { usePublicClient } from "wagmi";
import { useZeroDevConfig } from "../providers/ZeroDevAppContext";
import { useKernelAccount } from "../providers/ZeroDevValidatorContext";
import { PaymasterERC20, PaymasterSPONSOR } from "../types";

export type KernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    chain: Chain | null;
    kernelAccount: KernelSmartAccount<EntryPoint> | undefined | null;
    kernelAccountClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>> | undefined | null;
    publicClient: PublicClient | undefined | null;
    entryPoint: EntryPoint | null;
    parameters: UseKernelClientParameters;
  }
];

export type GetKernelClientReturnType = {
  address: Address;
  kernelAccount: KernelSmartAccount<EntryPoint>;
  kernelClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>>;
};

export type UseKernelClientParameters = {
  paymaster?: PaymasterERC20 | PaymasterSPONSOR;
};

export type UseKernelClientReturnType = {
  address: Address | undefined;
  kernelAccount: KernelSmartAccount<EntryPoint> | undefined;
  kernelClient: KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>> | undefined;
  isConnected: boolean;
  isLoading: boolean;
  error: unknown;
} & UseQueryResult<GetKernelClientReturnType, unknown>;

async function getKernelClient({
  queryKey,
}: QueryFunctionContext<KernelClientKey>): Promise<GetKernelClientReturnType> {
  const [
    _key,
    {
      appId,
      publicClient,
      kernelAccount,
      entryPoint,
      chain,
      kernelAccountClient,
      parameters: { paymaster },
    },
  ] = queryKey;

  if (kernelAccountClient) {
    return {
      kernelClient: kernelAccountClient,
      kernelAccount: kernelAccountClient.account,
      address: kernelAccountClient.account.address,
    };
  }

  if (!appId || !chain || !publicClient || !kernelAccount || !entryPoint) {
    throw new Error("missing appId or kernelAccount");
  }

  const kernelClient = createKernelAccountClient({
    account: kernelAccount,
    chain: chain,
    bundlerTransport: http(
      `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
    ),
    entryPoint: entryPoint,
    middleware: {
      gasPrice: async () => {
        const client = createClient({
          chain: chain,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v3/bundler/${appId!}?paymasterProvider=PIMLICO`
          ),
        })
          .extend(bundlerActions(entryPoint))
          .extend(pimlicoBundlerActions(entryPoint));
        return (await client.getUserOperationGasPrice()).fast;
      },
      sponsorUserOperation: async ({ userOperation }) => {
        let gasToken;
        if (!paymaster?.type) return userOperation;

        if (paymaster.type === "ERC20") {
          const chainId = chain.id as keyof typeof gasTokenAddresses;
          if (
            !(chainId in gasTokenAddresses) ||
            !(paymaster.gasToken in gasTokenAddresses[chainId])
          ) {
            throw new Error("ERC20 token not supported");
          }
          gasToken =
            paymaster.gasToken as keyof (typeof gasTokenAddresses)[typeof chainId];
        }

        const kernelPaymaster = createZeroDevPaymasterClient({
          entryPoint: entryPoint,
          chain: chain,
          transport: http(
            `https://meta-aa-provider.onrender.com/api/v2/paymaster/${appId!}?paymasterProvider=PIMLICO`
          ),
        });
        return kernelPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: entryPoint,
          gasToken: gasToken
        });
      },
    },
  }) as KernelAccountClient<EntryPoint, Transport, Chain, KernelSmartAccount<EntryPoint>>;
  return { kernelClient, kernelAccount, address: kernelAccount.address };
}

export function useKernelClient(
  parameters: UseKernelClientParameters = {}
): UseKernelClientReturnType {
  const { appId, chain } = useZeroDevConfig();
  const { kernelAccount, entryPoint, kernelAccountClient } = useKernelAccount();
  const client = usePublicClient();

  const { data, ...result } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        parameters,
        kernelAccount,
        appId,
        entryPoint,
        chain,
        kernelAccountClient,
      },
    ],
    queryFn: getKernelClient as unknown as QueryFunction<any>,
    enabled: !!client && !!appId && !!entryPoint && !!chain,
  });

  return {
    ...data,
    isConnected: !!data?.kernelClient,
    ...result
  };
}
