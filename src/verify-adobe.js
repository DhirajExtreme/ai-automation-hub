import { listTaggedDocuments } from './adobe.js';

const result = await listTaggedDocuments();
const documents = result.documents || [];

console.log(`Adobe Express connection OK. Tagged documents visible to the technical account: ${documents.length}`);
for (const doc of documents) {
  console.log(`- ${doc.name} -> ${doc.id}`);
}
