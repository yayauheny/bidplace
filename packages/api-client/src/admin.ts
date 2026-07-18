import { adminUsersResponseSchema, sellerProfileResponseSchema, type SellerStatus } from '@bidplace/contracts';
import { requestJson, type RequestContext } from './request';
export function createAdminClient(context: RequestContext) { return { listUsers() { return requestJson(context, '/api/admin/users', adminUsersResponseSchema); }, updateSellerStatus(sellerProfileId: string, status: SellerStatus) { return requestJson(context, `/api/admin/seller-profiles/${sellerProfileId}/status`, sellerProfileResponseSchema, { method: 'PATCH', body: { status } }); } }; }
