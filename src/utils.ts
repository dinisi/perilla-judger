import { SandboxStatus } from "simple-sandbox/lib/interfaces";
import { SolutionResult } from "./interfaces";

export const append = (origin: string, str: string) => {
    return origin.endsWith("\n") ? origin + str : origin + "\n" + str;
};

export const convertStatus = (origin: SandboxStatus) => {
    switch (origin) {
        case SandboxStatus.Cancelled:
            return SolutionResult.JudgementFailed;
        case SandboxStatus.MemoryLimitExceeded:
            return SolutionResult.MemoryLimitExceeded;
        case SandboxStatus.OK:
            return SolutionResult.Accepted;
        case SandboxStatus.OutputLimitExceeded:
            return SolutionResult.RuntimeError;
        case SandboxStatus.RuntimeError:
            return SolutionResult.RuntimeError;
        case SandboxStatus.TimeLimitExceeded:
            return SolutionResult.TimeLimitExceeded;
        case SandboxStatus.Unknown:
            return SolutionResult.JudgementFailed;
    }
};
