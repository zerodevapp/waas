import {
  QueryFunction,
  QueryFunctionContext,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import {
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  KernelAccountClient,
  KernelSmartAccount,
  gasTokenAddresses,
  type KernelValidator,
} from "@zerodev/sdk";
import { type EntryPoint } from "permissionless/types";
import { http, type Chain, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useZeroDevConfig } from "../providers/ZeroDevAppContext";
import { useKernelAccount } from "../providers/ZeroDevValidatorContext";
import { getSessionKernelAccount } from "../utils/sessions/getSessionKernelAccount";
import {
  type PaymasterERC20,
  type PaymasterSPONSOR,
  type SessionType,
} from "../types";
import { useSessions } from "./useSessions";
import { ZERODEV_BUNDLER_URL, ZERODEV_PAYMASTER_URL } from "../utils/constants";

export type UseSessionKernelClientParameters = {
  sessionId?: `0x${string}` | null | undefined;
  paymaster?: PaymasterERC20 | PaymasterSPONSOR;
};

export type SessionKernelClientKey = [
  key: string,
  params: {
    appId: string | undefined | null;
    chain: Chain | null;
    validator: KernelValidator<EntryPoint> | undefined | null;
    kernelAddress: string | undefined | null;
    publicClient: PublicClient | undefined | null;
    parameters: UseSessionKernelClientParameters;
    session: SessionType | undefined;
    entryPoint: EntryPoint | null;
  }
];

export type GetSessionKernelClientReturnType = {
  kernelClient: KernelAccountClient<EntryPoint>;
  kernelAccount: KernelSmartAccount<EntryPoint>;
}

export type UseSessionKernelClientReturnType = {
  kernelClient: KernelAccountClient<EntryPoint>;
  kernelAccount: KernelSmartAccount<EntryPoint>;
  isLoading: boolean;
  error: unknown;
} & UseQueryResult<GetSessionKernelClientReturnType, unknown>;

async function getSessionKernelClient({
  queryKey,
}: QueryFunctionContext<SessionKernelClientKey>) {
  const [
    _key,
    {
      appId,
      chain,
      publicClient,
      parameters,
      validator,
      session,
      kernelAddress,
      entryPoint,
    },
  ] = queryKey;
  const { sessionId, paymaster } = parameters;

  if (!appId || !chain) {
    throw new Error("appId and chain are required");
  }
  if (!entryPoint) {
    throw new Error("entryPoint is required");
  }
  if (!publicClient) {
    throw new Error("publicClient is required");
  }

  // get session from sessionId
  if (!session) {
    throw new Error("session not found");
  }
  const accountSession = Object.values(session).filter(
    (s) => s.smartAccount === kernelAddress
  );
  if (accountSession.length === 0) {
    throw new Error("No available session for this account");
  }
  if (accountSession.length > 1 && !sessionId) {
    throw new Error("sessionId is required");
  }
  const selectedSession = sessionId ? session[sessionId] : accountSession[0];

  // create kernelAccountClient
  const sessionSigner = privateKeyToAccount(selectedSession.sessionKey);
  const { kernelAccount } = await getSessionKernelAccount({
    sessionSigner,
    publicClient,
    sudoValidator: validator!,
    entryPoint: entryPoint,
    policies: selectedSession.policies,
    permissions: selectedSession.permissions,
    enableSignature: selectedSession.enableSignature,
  });
  const kernelClient = createKernelAccountClient({
    account: kernelAccount,
    chain: chain,
    bundlerTransport: http(
      `${ZERODEV_BUNDLER_URL}/${appId}?paymasterProvider=PIMLICO`
    ),
    entryPoint: entryPoint,
    middleware: !paymaster?.type ? undefined : {
      sponsorUserOperation: async ({ userOperation }) => {
        let gasToken;

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
            `${ZERODEV_PAYMASTER_URL}/${appId}?paymasterProvider=PIMLICO`
          ),
        });
        return kernelPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: entryPoint,
          gasToken: gasToken
        });
      },
    },
  });

  return { kernelClient, kernelAccount };
}

export function useSessionKernelClient(
  parameters: UseSessionKernelClientParameters = {}
): UseSessionKernelClientReturnType {
  const { appId, chain } = useZeroDevConfig();
  const client = usePublicClient();
  const { validator, kernelAccount, entryPoint } = useKernelAccount();
  const session = useSessions();
  const kernelAddress = kernelAccount?.address;

  const { data, ...result } = useQuery({
    queryKey: [
      "session_kernel_client",
      {
        publicClient: client,
        kernelAddress,
        parameters,
        validator,
        session,
        appId,
        chain,
        entryPoint,
      },
    ],
    queryFn: getSessionKernelClient as unknown as QueryFunction<any>,
    enabled:
      !!client &&
      !!validator &&
      !!appId &&
      !!kernelAddress &&
      !!entryPoint &&
      !!chain,
  });

  return {
    ...data,
    ...result
  };
}
