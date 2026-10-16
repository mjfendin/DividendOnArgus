import { handleRpcRequest } from './_rpc'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  return handleRpcRequest(req)
}
