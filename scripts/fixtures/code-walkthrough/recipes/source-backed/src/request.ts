type RequestInput = {
  query: string;
};

export function buildRequest({ query }: RequestInput) {
  return { query, pageSize: 10 };
}
