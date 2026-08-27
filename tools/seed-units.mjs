const FIRESTORE_URL =
  'http://127.0.0.1:8080/v1/projects/demo-tankos/databases/(default)/documents/units';
const CATALOGUE_VERSION = 'UN/CEFACT-Rev17-aquarium-core';

const units = [
  ['UN-CEFACT-BAR', 'UN/CEFACT:BAR', 'metric', 'bar', 'bar'],
  ['UN-CEFACT-CEL', 'UN/CEFACT:CEL', 'si', '°C', 'degC'],
  ['UN-CEFACT-CMT', 'UN/CEFACT:CMT', 'si', 'cm', 'cm'],
  ['UN-CEFACT-FAH', 'UN/CEFACT:FAH', 'us-customary', '°F', 'degF'],
  [
    'UN-CEFACT-GLI',
    'UN/CEFACT:GLI',
    'british-imperial',
    'gal (UK)',
    'gal (UK)',
  ],
  ['UN-CEFACT-GLL', 'UN/CEFACT:GLL', 'us-customary', 'gal (US)', 'gal (US)'],
  ['UN-CEFACT-GRM', 'UN/CEFACT:GRM', 'si', 'g', 'g'],
  ['UN-CEFACT-KEL', 'UN/CEFACT:KEL', 'si', 'K', 'K'],
  ['UN-CEFACT-KGM', 'UN/CEFACT:KGM', 'si', 'kg', 'kg'],
  ['UN-CEFACT-LTR', 'UN/CEFACT:LTR', 'si', 'L', 'L'],
  ['UN-CEFACT-MLT', 'UN/CEFACT:MLT', 'si', 'mL', 'mL'],
  ['UN-CEFACT-MTR', 'UN/CEFACT:MTR', 'si', 'm', 'm'],
  ['UN-CEFACT-PAL', 'UN/CEFACT:PAL', 'si', 'Pa', 'Pa'],
];

function value(stringValue) {
  return { stringValue };
}

function arrayValue(values) {
  return { arrayValue: { values: values.map((item) => value(item)) } };
}

function searchTokens(input) {
  const normalized = input.toLocaleLowerCase();
  const tokens = new Set();
  for (let start = 0; start < normalized.length; start += 1) {
    for (let end = start + 2; end <= normalized.length; end += 1) {
      tokens.add(normalized.slice(start, end));
    }
  }
  return [...tokens];
}

function mapValue(fields) {
  return { mapValue: { fields } };
}

function unitDocument(code, system, symbol, asciiFallback) {
  const now = new Date().toISOString();
  return {
    fields: {
      data: mapValue({
        code: value(code),
        codeSearchTokens: arrayValue(searchTokens(code)),
        visibility: value('public'),
        system: value(system),
        representation: mapValue({
          symbol: value(symbol),
          asciiFallback: value(asciiFallback),
          position: value('suffix'),
          spacing: value('narrow'),
        }),
        catalogueVersion: value(CATALOGUE_VERSION),
      }),
      lifecycle: mapValue({ status: value('active') }),
      revision: { integerValue: '1' },
      metadata: mapValue({
        schemaVersion: { integerValue: '1' },
        createdAt: { timestampValue: now },
        updatedAt: { timestampValue: now },
      }),
    },
  };
}

for (const [id, code, system, symbol, asciiFallback] of units) {
  const url = `${FIRESTORE_URL}/${id}`;
  const existing = await fetch(url, {
    headers: { Authorization: 'Bearer owner' },
  });
  if (existing.ok) continue;
  if (existing.status !== 404) {
    throw new Error(`Unable to inspect unit seed document ${id}`);
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(unitDocument(code, system, symbol, asciiFallback)),
  });
  if (!response.ok) {
    throw new Error(`Unable to seed unit ${code}: ${response.status}`);
  }
}

console.log(`Units seed checked (${units.length} public definitions).`);
