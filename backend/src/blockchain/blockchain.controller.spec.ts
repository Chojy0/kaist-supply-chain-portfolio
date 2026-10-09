jest.mock('@hiero-ledger/sdk', () => ({}));
import { BlockchainController } from './blockchain.controller';
import { UserRole } from '../users/user.entity';
import { LcaDataStatus } from '../lca-data/lca-data.entity';
import { ConfigService } from '@nestjs/config';

const owner = { id: 'owner', role: UserRole.TIER1_SUPPLIER } as any;
describe('anchor workflow', () => {
  function setup() {
    const data = { productName: 'sample', status: LcaDataStatus.APPROVED };
    const lca = {findOne: jest.fn().mockResolvedValue(data)};
    const gateway = {submit: jest.fn().mockResolvedValue({topicId:'0.0.1',sequenceNumber:'1',transactionId:'tx'}), verify: jest.fn()};
    const repo = {findOneBy: jest.fn().mockResolvedValue(null), insert:jest.fn(), update:jest.fn()};
    const controller = new BlockchainController(lca as any,gateway as any,new ConfigService({HEDERA_ENABLED:'true'}),repo as any);
    return { data,lca,gateway,repo,controller };
  }
  it('requires approval and prevents supplier submissions', async () => {
    const x=setup();
    await expect(x.controller.anchor('id',{...owner,role:UserRole.TIER2PLUS_SUPPLIER},{publishHash:true})).rejects.toThrow();
    x.data.status=LcaDataStatus.SUBMITTED;
    await expect(x.controller.anchor('id',owner,{publishHash:true})).rejects.toThrow('Approve');
    expect(x.gateway.submit).not.toHaveBeenCalled();
  });
  it('reserves a document, persists receipt, and does not publish source data', async () => {
    const x=setup();
    await x.controller.anchor('id',owner,{publishHash:true});
    expect(x.repo.insert).toHaveBeenCalledWith(expect.objectContaining({id:'id',status:'submitting'}));
    expect(x.gateway.submit.mock.calls[0][0]).toMatch(/^[a-f0-9]{64}$/);
    expect(x.repo.update).toHaveBeenCalledWith('id',expect.objectContaining({status:'submitted'}));
  });
  it('blocks automatic retry after an uncertain submission', async () => {
    const x=setup();x.repo.findOneBy.mockResolvedValue({status:'submitting'});
    await expect(x.controller.anchor('id',owner,{publishHash:true})).rejects.toThrow('review');
    expect(x.gateway.submit).not.toHaveBeenCalled();
  });
});
