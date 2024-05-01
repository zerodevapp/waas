import type { MutateOptions } from "@tanstack/query-core"
import {
    type DefaultError,
    type QueryKey,
    type UseMutationOptions,
    type UseMutationResult,
    type UseQueryOptions,
    type UseQueryResult,
    useQuery as tanstack_useQuery
} from "@tanstack/react-query"
import type { Evaluate, UnionOmit } from "@wagmi/core/internal"
import { hashFn } from "@wagmi/core/query"
import type { ExactPartial } from "./utils"

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

export type UseQueryParameters<
    queryFnData = unknown,
    error = DefaultError,
    data = queryFnData,
    queryKey extends QueryKey = QueryKey
> = Evaluate<
    ExactPartial<
        Omit<UseQueryOptions<queryFnData, error, data, queryKey>, "initialData">
    > & {
        // Fix `initialData` type
        initialData?:
            | UseQueryOptions<queryFnData, error, data, queryKey>["initialData"]
            | undefined
    }
>

export type QueryParameter<
    queryFnData = unknown,
    error = DefaultError,
    data = queryFnData,
    queryKey extends QueryKey = QueryKey
> = {
    query?:
        | Omit<
              UseQueryParameters<queryFnData, error, data, queryKey>,
              | "queryFn"
              | "queryHash"
              | "queryKey"
              | "queryKeyHashFn"
              | "throwOnError"
          >
        | undefined
}

export type UseQueryReturnType<data = unknown, error = DefaultError> = Evaluate<
    UseQueryResult<data, error> & {
        queryKey: QueryKey
    }
>

export function useQuery<queryFnData, error, data, queryKey extends QueryKey>(
    parameters: UseQueryParameters<queryFnData, error, data, queryKey> & {
        queryKey: QueryKey
    }
): UseQueryReturnType<data, error> {
    const result = tanstack_useQuery({
        ...(parameters as any),
        queryKeyHashFn: hashFn // for bigint support
    }) as UseQueryReturnType<data, error>
    result.queryKey = parameters.queryKey
    return result
}
