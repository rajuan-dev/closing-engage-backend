import { ClosingDocument } from '../documents/documents.model';
import { Order } from '../orders/orders.model';
import { CompanyUser } from '../user/company-user.model';
import { NotaryUser } from '../user/notary-user.model';

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type: 'order' | 'notary' | 'document' | 'company';
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const globalSearch = async (query: string): Promise<SearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const regex = new RegExp(escapeRegex(trimmed), 'i');

  const [orders, notaries, companies, documents] = await Promise.all([
    Order.find({
      $or: [
        { orderNumber: regex },
        { titleCompany: regex },
        { assignedNotaryName: regex },
        { clientName: regex },
        { propertyAddress: regex },
      ],
    })
      .select('orderNumber titleCompany assignedNotaryName')
      .sort({ createdAt: -1 })
      .limit(4),
    NotaryUser.find({
      $or: [{ fullName: regex }, { specialty: regex }, { email: regex }, { serviceArea: regex }],
    })
      .select('fullName specialty')
      .sort({ createdAt: -1 })
      .limit(4),
    CompanyUser.find({
      $or: [{ companyName: regex }, { contactPerson: regex }, { businessEmail: regex }, { contactEmail: regex }],
    })
      .select('companyName contactPerson')
      .sort({ createdAt: -1 })
      .limit(4),
    ClosingDocument.find({
      $or: [{ fileName: regex }, { orderNumber: regex }, { uploadedByName: regex }],
    })
      .select('fileName orderNumber')
      .sort({ createdAt: -1 })
      .limit(4),
  ]);

  const results: SearchResult[] = [
    ...orders.map((order) => ({
      id: order._id.toString(),
      title: order.orderNumber,
      subtitle: `${order.titleCompany} · ${order.assignedNotaryName || 'Unassigned'}`,
      type: 'order' as const,
    })),
    ...notaries.map((notary) => ({
      id: notary._id.toString(),
      title: notary.fullName,
      subtitle: notary.specialty || 'Notary',
      type: 'notary' as const,
    })),
    ...companies.map((company) => ({
      id: company._id.toString(),
      title: company.companyName,
      subtitle: company.contactPerson || company.businessEmail,
      type: 'company' as const,
    })),
    ...documents.map((document) => ({
      id: document._id.toString(),
      title: document.fileName,
      subtitle: `Order: ${document.orderNumber}`,
      type: 'document' as const,
    })),
  ];

  return results.slice(0, 8);
};
