import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import type { KernelAccountClient } from "@zerodev/sdk"
import type { EntryPoint } from "permissionless/types"
import { useContext, useMemo } from "react"
import { ZeroDevValidatorContext } from "../providers/ZeroDevValidatorContext"

export type UseSetKernelClientKey = {
    kernelClient: KernelAccountClient<EntryPoint> | undefined
    setKernelAccountClient: (kernelAccountClient: any | null) => void
}

export type SetKernelClientReturnType = boolean

export type UseSetKernelClientReturnType = {
    setKernelClient: (kernelClient: any) => void
} & Omit<
    UseMutationResult<
        SetKernelClientReturnType,
        unknown,
        UseSetKernelClientKey,
        unknown
    >,
    "mutate"
>

function mutationKey({ ...config }: UseSetKernelClientKey) {
    const { kernelClient, setKernelAccountClient } = config

    return [
        {
            entity: "SetKernelClient",
            kernelClient,
            setKernelAccountClient
        }
    ] as const
}

async function mutationFn(
    config: UseSetKernelClientKey
): Promise<SetKernelClientReturnType> {
    const { setKernelAccountClient, kernelClient } = config

    if (!kernelClient || !setKernelAccountClient) {
        throw new Error("kernelClient is required")
    }

    setKernelAccountClient(kernelClient)

    return true
}

export function useSetKernelClient(): UseSetKernelClientReturnType {
    const { setKernelAccountClient } = useContext(ZeroDevValidatorContext)

    const { mutate, ...result } = useMutation({
        mutationKey: mutationKey({
            setKernelAccountClient,
            kernelClient: undefined
        }),
        mutationFn
    })

    const setKernelClient = useMemo(() => {
        return (kernelClient: any) => {
            mutate({
                setKernelAccountClient,
                kernelClient
            })
        }
    }, [mutate, setKernelAccountClient])

    return {
        ...result,
        setKernelClient
    }
}
