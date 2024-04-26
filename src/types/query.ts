import type { MutateOptions } from "@tanstack/query-core"
import type {
    UseMutationOptions,
    UseMutationResult
} from "@tanstack/react-query"
import type { Evaluate, UnionOmit } from "@wagmi/core/internal"

type MutateFn<
    data = unknown,
    error = unknown,
    variables = void,
    context = unknown
> = undefined extends variables
    ? (
          variables?: variables,
          options?:
              | Evaluate<MutateOptions<data, error, variables, context>>
              | undefined
      ) => Promise<data>
    : (
          variables: variables,
          options?:
              | Evaluate<MutateOptions<data, error, variables, context>>
              | undefined
      ) => Promise<data>

export type Mutate<
    data = unknown,
    error = unknown,
    variables = void,
    context = unknown
> = (
    ...args: Parameters<MutateFn<data, error, Evaluate<variables>, context>>
) => void

export type MutateAsync<
    data = unknown,
    error = unknown,
    variables = void,
    context = unknown
> = MutateFn<data, error, Evaluate<variables>, context>

export type UseMutationParameters<
    data = unknown,
    error = Error,
    variables = void,
    context = unknown
> = Evaluate<
    Omit<
        UseMutationOptions<data, error, Evaluate<variables>, context>,
        "mutationFn" | "mutationKey" | "throwOnError"
    >
>

export type UseMutationReturnType<
    data = unknown,
    error = Error,
    variables = void,
    context = unknown
> = Evaluate<
    UnionOmit<
        UseMutationResult<data, error, variables, context>,
        "mutate" | "mutateAsync"
    >
>
