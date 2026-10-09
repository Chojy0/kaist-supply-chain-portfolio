import { FeedbackService } from './feedback.service';
import { User, UserRole } from '../users/user.entity';

describe('feedback tenant scope', () => {
  it('scopes list, LCA list and detail to the authenticated supplier', async () => {
    const repository = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue({id:'feedback'}) };
    const service = new FeedbackService(repository as any, {} as any, {} as any);
    const user = { id: 'supplier', role: UserRole.TIER2PLUS_SUPPLIER } as User;
    await service.findAll({tier1SupplierId:'someone-else'},user);
    expect(repository.find.mock.calls[0][0].where.lcaData).toEqual({supplierId:'supplier'});
    await service.findByLcaDataId('other-document',user);
    expect(repository.find.mock.calls[1][0].where.lcaData).toEqual({supplierId:'supplier'});
    await service.findOne('feedback',user);
    expect(repository.findOne.mock.calls[0][0].where.lcaData).toEqual({supplierId:'supplier'});
  });
});
