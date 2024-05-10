import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import {
    type KernelSmartAccount,
    type KernelValidator,
    createKernelAccount
} from "@zerodev/sdk"
import { getSocialValidator, isAuthorized } from "@zerodev/social-validator"
import type { EntryPoint } from "permissionless/types"
import { useCallback, useEffect } from "react"
import type { Config } from "../createConfig"
import { useSocial } from "../providers/SocialContext"
import { useSetKernelAccount } from "../providers/ZeroDevValidatorContext"
import type { KernelVersionType } from "../types"
import { getEntryPointFromVersion } from "../utils/entryPoint"
import { useConfig } from "./useConfig"

export type UseCreateKernelClientSocialParameters = {
    version: KernelVersionType
    oauthCallbackUrl?: string
}

export type UseCreateKernelClientSocialKey = {
    version: KernelVersionType
    oauthCallbackUrl?: string
    config: Config
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
    const { oauthCallbackUrl, config: zdConfig } = config

    return [
        {
            entity: "CreateKernelClient",
            oauthCallbackUrl,
            config: zdConfig
        }
    ] as const
}

async function mutationFn(
    config: UseCreateKernelClientSocialKey
): Promise<CreateKernelClientSocialReturnType> {
    const { config: zdConfig, version, type } = config
    const projectId = zdConfig.projectIds[zdConfig.state.chainId]
    const publicClient = zdConfig.getClient({ chainId: zdConfig.state.chainId })

    if (!(await isAuthorized({ projectId }))) {
        throw new Error("Not authorized")
    }

    let socialValidator: KernelValidator<EntryPoint>
    const entryPoint = getEntryPointFromVersion(version)

    if (type === "getSocialValidator") {
        socialValidator = await getSocialValidator(publicClient, {
            entryPoint,
            projectId
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
    const uid = `social:${kernelAccount.address}`
    zdConfig.setState((x) => {
        const chainId = x.chainId
        return {
            ...x,
            connections: new Map(x.connections).set(uid, {
                chainId,
                accounts: [
                    {
                        client: null,
                        account: kernelAccount,
                        entryPoint,
                        validator: socialValidator
                    }
                ]
            }),
            current: uid
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
    const config = useConfig()
    const {
        setIsSocialPending,
        isSocialPending,
        login: loginSocial
    } = useSocial()

    const { data, mutate, ...result } = useMutation({
        mutationKey: mutationKey({
            config,
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
                config,
                version,
                type: "getSocialValidator",
                oauthCallbackUrl
            })
        }
        load()
    }, [mutate, version, oauthCallbackUrl, config])

    return {
        ...result,
        data,
        isPending: isSocialPending,
        login
    }
}
