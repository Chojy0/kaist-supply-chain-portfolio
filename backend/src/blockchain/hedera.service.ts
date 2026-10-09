import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, PrivateKey, TopicMessageSubmitTransaction, Hbar, CustomFeeLimit } from '@hiero-ledger/sdk';
import { anchorMessage, matchesAnchor } from './evidence-hash';

@Injectable()
export class HederaService {
  constructor(private readonly config: ConfigService) {}

  async submit(hash: string) {
    if (this.config.get('HEDERA_ENABLED') !== 'true') {
      throw new ServiceUnavailableException('Hedera testnet integration is disabled');
    }
    const account = this.config.get<string>('HEDERA_ACCOUNT_ID');
    const key = this.config.get<string>('HEDERA_PRIVATE_KEY');
    const topic = this.config.get<string>('HEDERA_TOPIC_ID');
    if (!account || !key || !topic || !/^0\.0\.\d+$/.test(topic)) {
      throw new ServiceUnavailableException('Hedera testnet configuration is incomplete');
    }
    const client = Client.forTestnet();
    try {
      client.setOperator(account, PrivateKey.fromStringDer(key));
      const result = await new TopicMessageSubmitTransaction()
        .setTopicId(topic).setMessage(anchorMessage(hash)).setMaxChunks(1)
        .setCustomFeeLimits([new CustomFeeLimit().setAccountId(account).setFees([])])
        .setMaxTransactionFee(new Hbar(1)).execute(client);
      const receipt = await result.getReceipt(client);
      if (receipt.status.toString() !== 'SUCCESS' || !receipt.topicSequenceNumber) {
        throw new Error('Receipt not confirmed');
      }
      return { network: 'testnet', topicId: topic, sequenceNumber: receipt.topicSequenceNumber.toString(), transactionId: result.transactionId.toString(), hash };
    } catch {
      throw new ServiceUnavailableException('Hedera submission was not confirmed. Check the transaction before retrying.');
    } finally { client.close(); }
  }

  async verify(topic: string, sequence: string, hash: string) {
    if (!/^0\.0\.\d+$/.test(topic) || !/^\d+$/.test(sequence)) return { matched: false, pending: false };
    try {
      const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/topics/${topic}/messages/${sequence}`, { signal: AbortSignal.timeout(10000) });
      if (response.status === 404) return { matched: false, pending: true };
      if (!response.ok) throw new Error('Mirror unavailable');
      const record = await response.json() as { message: string; consensus_timestamp: string; topic_id: string; sequence_number: number };
      return { matched: record.topic_id === topic && String(record.sequence_number) === sequence && matchesAnchor(record.message, hash), pending: false, consensusTimestamp: record.consensus_timestamp };
    } catch { throw new ServiceUnavailableException('Hedera mirror lookup failed'); }
  }
}
