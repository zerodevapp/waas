import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import {
    getSocialValidator,
    initiateLogin,
    isAuthorized
} from "@zerodev/social-validator"
import type { EntryPoint } from "permissionless/types"
import { useCallback, useEffect } from "react"
import type { PublicClient } from "viem"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import type { KernelVersionType } from "../types"
import { getEntryPointFromVersion } from "../utils/entryPoint"

export type UseCreateKernelClientSocialParameters = {
    version: KernelVersionType
    socialProvider: "google" | "facebook"
    oauthCallbackUrl?: string
}

export type UseCreateKernelClientSocialKey = {
    socialProvider: "google" | "facebook"
    version: KernelVersionType
    oauthCallbackUrl?: string
    publicClient?: PublicClient
    appId?: string
    type?: "getSocialValidator"
}

export type CreateKernelClientSocialReturnType = {
    validator: KernelValidator<EntryPoint>
    kernelAccount: KernelSmartAccount<EntryPoint>
    entryPoint: EntryPoint
}

export type UseCreateKernelClientSocialReturnType = {
    login: () => void
} & Omit<
    UseMutationResult<
        CreateKernelClientSocialReturnType,
        unknown,
        UseCreateKernelClientSocialKey,
        unknown
    >,
    "mutate"
>

function mutationKey(config: UseCreateKernelClientSocialKey) {
    const { socialProvider, oauthCallbackUrl, publicClient, appId } = config

    return [
        {
            entity: "CreateKernelClient",
            socialProvider,
            oauthCallbackUrl,
            publicClient,
            appId
        }
    ] as const
}

async function mutationFn(
    config: UseCreateKernelClientSocialKey
): Promise<CreateKernelClientSocialReturnType> {
    const { publicClient, appId, version, type, socialProvider } = config

    if (!publicClient || !appId) {
        throw new Error("missing publicClient or appId")
    }
    let socialValidator: KernelValidator<EntryPoint>
    const entryPoint = getEntryPointFromVersion(version)

    if (type === "getSocialValidator") {
        if (!socialProvider) {
            throw new Error("missing social provider")
        }

        socialValidator = await getSocialValidator(publicClient, {
            entryPoint
        })
    } else {
        throw new Error("invalid type")
    }

    const kernelAccount = await createKernelAccount(publicClient, {
        entryPoint: entryPoint,
        plugins: {
            sudo: socialValidator
        }
    })

    return { validator: socialValidator, kernelAccount, entryPoint }
}

export function useCreateKernelClientSocial({
    version,
    socialProvider,
    oauthCallbackUrl
}: UseCreateKernelClientSocialParameters): UseCreateKernelClientSocialReturnType {
    const {
        setValidator,
        setKernelAccount,
        setEntryPoint,
        setKernelAccountClient
    } = useSetKernelAccount()
    const { appId, client } = useZeroDevConfig()

    const { data, mutate, ...result } = useMutation({
        mutationKey: mutationKey({
            appId: appId ?? undefined,
            publicClient: client ?? undefined,
            type: undefined,
            version,
            socialProvider,
            oauthCallbackUrl
        }),
        mutationFn,
        onSuccess: (data) => {
            setValidator(data.validator)
            setKernelAccount(data.kernelAccount)
            setEntryPoint(data.entryPoint)
            setKernelAccountClient(null)
        }
    })

    const login = useCallback(() => {
        initiateLogin(socialProvider, oauthCallbackUrl)
    }, [oauthCallbackUrl, socialProvider])

    useEffect(() => {
        const load = async () => {
            if (!(await isAuthorized())) {
                return
            }
            mutate({
                appId: appId ?? undefined,
                publicClient: client ?? undefined,
                version,
                type: "getSocialValidator",
                socialProvider,
                oauthCallbackUrl
            })
        }
        load()
    }, [appId, mutate, client, version, socialProvider, oauthCallbackUrl])

    return {
        ...result,
        data,
        isPending: !client || result.isPending,
        login
    }
}
