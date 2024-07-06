enum requestTypes {
  POST = "POST",
  GET = "GET",
  DELETE = "DELETE",
  PUT = "PUT",
}

function makeReq<B>(requestConfig: {
  body: B;
  method: requestTypes;
  headers: object;
}) {}

function askAI(prompt: string) {
  return;
}

function generateApiTypeDefsUsingAI(content) {}
