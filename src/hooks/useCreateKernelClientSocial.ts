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
import { useCallback, useEffect, useState } from "react"
import type { PublicClient } from "viem"
import { useSocial } from "../providers/SocialContext"
import { useZeroDevConfig } from "../providers/ZeroDevAppContext"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import type { KernelVersionType } from "../types"
import { getEntryPointFromVersion } from "../utils/entryPoint"

export type UseCreateKernelClientSocialParameters = {
    version: KernelVersionType
    oauthCallbackUrl?: string
}

export type UseCreateKernelClientSocialKey = {
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
    login: (socialProvider: "google" | "facebook") => void
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
    const { oauthCallbackUrl, publicClient, appId } = config

    return [
        {
            entity: "CreateKernelClient",
            oauthCallbackUrl,
            publicClient,
            appId
        }
    ] as const
}

async function mutationFn(
    config: UseCreateKernelClientSocialKey
): Promise<CreateKernelClientSocialReturnType> {
    const { publicClient, appId, version, type } = config

    if (!appId || !(await isAuthorized({ projectId: appId }))) {
        throw new Error("Not authorized")
    }

    if (!publicClient || !appId) {
        throw new Error("missing publicClient or appId")
    }
    let socialValidator: KernelValidator<EntryPoint>
    const entryPoint = getEntryPointFromVersion(version)

    if (type === "getSocialValidator") {
        socialValidator = await getSocialValidator(publicClient, {
            entryPoint,
            projectId: appId
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
    oauthCallbackUrl
}: UseCreateKernelClientSocialParameters): UseCreateKernelClientSocialReturnType {
    const {
        setValidator,
        setKernelAccount,
        setEntryPoint,
        setKernelAccountClient
    } = useSetKernelAccount()
    const { appId, client } = useZeroDevConfig()
    const {
        setIsSocialPending,
        isSocialPending,
        login: loginSocial
    } = useSocial()

    const { data, mutate, ...result } = useMutation({
        mutationKey: mutationKey({
            appId: appId ?? undefined,
            publicClient: client ?? undefined,
            type: undefined,
            version,
            oauthCallbackUrl
        }),
        mutationFn,
        onSuccess: (data) => {
            setValidator(data.validator)
            setKernelAccount(data.kernelAccount)
            setEntryPoint(data.entryPoint)
            setKernelAccountClient(null)
        },
        onMutate() {
            setIsSocialPending(true)
        },
        onSettled() {
            setIsSocialPending(false)
        }
    })

    const login = useCallback(
        (socialProvider: "google" | "facebook") => {
            loginSocial(socialProvider, oauthCallbackUrl)
        },
        [oauthCallbackUrl, loginSocial]
    )

    useEffect(() => {
        const load = async () => {
            mutate({
                appId: appId ?? undefined,
                publicClient: client ?? undefined,
                version,
                type: "getSocialValidator",
                oauthCallbackUrl
            })
        }
        load()
    }, [appId, mutate, client, version, oauthCallbackUrl])

    return {
        ...result,
        data,
        isPending: isSocialPending,
        login
    }
}
