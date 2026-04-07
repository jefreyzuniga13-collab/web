type ErrorWithResponseMessage = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const customError = error as ErrorWithResponseMessage;
    const responseMessage = customError.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim() !== "") {
      return responseMessage;
    }

    if (error.message.trim() !== "") {
      return error.message;
    }
  }

  if (typeof error === "object" && error !== null) {
    const customError = error as ErrorWithResponseMessage;
    const responseMessage = customError.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim() !== "") {
      return responseMessage;
    }
  }

  return "Por favor, intenta de nuevo.";
}