export interface InclusiveDateRange {
  from?: Date;
  to?: Date;
}

export const getInclusiveDateRange = (q: any): InclusiveDateRange => {
  const rawFrom = q?.dateFrom ?? q?.startDate;
  const rawTo = q?.dateTo ?? q?.endDate;
  let from: Date | undefined;
  let to: Date | undefined;

  if (rawFrom) {
    const d = new Date(String(rawFrom));
    if (!Number.isNaN(d.getTime())) {
      from = d;
      from.setHours(0, 0, 0, 0);
    }
  }

  if (rawTo) {
    const d = new Date(String(rawTo));
    if (!Number.isNaN(d.getTime())) {
      to = d;
      to.setHours(23, 59, 59, 999);
    }
  }

  return { from, to };
};
