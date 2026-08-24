import { SheriffConfig } from '@softarc/sheriff-core';

const contexts = [
  'aquarium-management',
  'care',
  'measurements',
  'observations',
  'timeline',
  'livestock',
  'equipment',
  'maintenance',
  'species-knowledge',
  'shared-access',
] as const;

const layers = ['domain', 'application', 'infrastructure', 'ui'] as const;

const modules: Record<string, string[]> = {};

for (const context of contexts) {
  for (const layer of layers) {
    modules[`apps/veril/src/app/${context}/${layer}`] = [
      `context:${context}`,
      `layer:${layer}`,
    ];
  }
}

for (const layer of layers) {
  modules[`apps/veril/src/app/shared/${layer}`] = [
    'context:shared',
    `layer:${layer}`,
  ];
}

modules['apps/veril/src/app/shells/<shell>'] = [
  'context:shells',
  'layer:composition',
];
modules['apps/veril/src/app/composition/integration-tests'] = [
  'context:composition',
  'layer:integration',
];
modules['apps/veril/src/app/composition/editorial'] = [
  'context:composition',
  'layer:composition',
];
modules['apps/veril/src/app/composition/<feature>'] = [
  'context:composition',
  'layer:composition',
];
modules['apps/veril/src/app/composition/shared-access'] = [
  'context:composition',
  'layer:composition',
];
modules['apps/tankos/src'] = ['context:tankos', 'tankos:layer:composition'];
modules['apps/tankos/src/app'] = [
  'context:tankos',
  'tankos:layer:composition',
];

for (const layer of layers) {
  modules[`apps/veril/src/app/shared-access/${layer}`] = [
    'context:shared-access',
    `layer:${layer}`,
  ];
}

const tankOsTimeLayers: Record<string, string[]> = {
  'libs/time/src': ['context:tankos', 'tankos:layer:library-root'],
  'libs/time/src/lib/time': [
    'context:tankos',
    'tankos:layer:library-root',
  ],
  'libs/time/src/lib/time/core': [
    'context:tankos',
    'tankos:layer:core',
  ],
  'libs/time/src/lib/time/core/ports': [
    'context:tankos',
    'tankos:layer:core',
  ],
  'libs/time/src/lib/time/core/value-types': [
    'context:tankos',
    'tankos:layer:core',
  ],
  'libs/time/src/lib/time/core/validation': [
    'context:tankos',
    'tankos:layer:core',
  ],
  'libs/time/src/lib/time/application': [
    'context:tankos',
    'tankos:layer:application',
  ],
  'libs/time/src/lib/time/composition': [
    'context:tankos',
    'tankos:layer:composition',
  ],
  'libs/time/src/lib/time/composition/angular': [
    'context:tankos',
    'tankos:layer:composition',
  ],
  'libs/time/src/lib/time/adapters': [
    'context:tankos',
    'tankos:layer:adapter',
  ],
  'libs/time/src/lib/time/adapters/angular': [
    'context:tankos',
    'tankos:layer:adapter',
  ],
  'libs/time/src/lib/time/adapters/native': [
    'context:tankos',
    'tankos:layer:adapter',
  ],
  'libs/time/src/lib/time/presentation': [
    'context:tankos',
    'tankos:layer:presentation',
  ],
  'libs/time/src/lib/time/presentation/pipes': [
    'context:tankos',
    'tankos:layer:presentation',
  ],
};

Object.assign(modules, tankOsTimeLayers);

modules['libs/units/src/lib/units'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/units/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/units/src/lib/units/core'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/units/src/lib/units/core/value-types'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/units/src/lib/units/core/errors'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/units/src/lib/units/core/ports'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/units/src/lib/units/adapters'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/units/src/lib/units/adapters/standard'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/units/src/lib/units/application'] = [
  'context:tankos',
  'tankos:layer:application',
];
modules['libs/units/src/lib/units/composition'] = [
  'context:tankos',
  'tankos:layer:composition',
];
modules['libs/units/src/lib/units/composition/standard'] = [
  'context:tankos',
  'tankos:layer:composition',
];
modules['libs/decimal/src/lib/decimal'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/decimal/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/decimal/src/lib/decimal/core'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/decimal/src/lib/decimal/core/value-types'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/decimal/src/lib/decimal/core/errors'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/decimal/src/lib/decimal/core/ports'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/decimal/src/lib/decimal/application'] = [
  'context:tankos',
  'tankos:layer:application',
];
modules['libs/decimal/src/lib/decimal/adapters'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/decimal/src/lib/decimal/composition'] = [
  'context:tankos',
  'tankos:layer:composition',
];
modules['libs/decimal/src/lib/decimal/composition/angular'] = [
  'context:tankos',
  'tankos:layer:composition',
];
for (const adapterPackage of [
  'time-firestore',
  'time-json-http',
  'time-zod',
  'decimal-big-js',
  'decimal-zod',
  'units-zod',
  'units-firestore',
  'units-json-http',
]) {
  modules[`libs/${adapterPackage}/src`] = [
    'context:tankos',
    'tankos:layer:library-root',
  ];
  modules[`libs/${adapterPackage}/src/lib`] = [
    'context:tankos',
    'tankos:layer:adapter',
  ];
}
modules['libs/time-firestore/src/lib/firestore'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/time-json-http/src/lib/json-http'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/time-zod/src/lib/zod'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/decimal-big-js/src/lib/big-js'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/decimal-zod/src/lib/zod'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/units-zod/src/lib/zod'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/units-firestore/src/lib/firestore'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/units-json-http/src/lib/json-http'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/data-access/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/data-access-ui/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/data-access-ui/src/lib'] = [
  'context:tankos',
  'tankos:layer:presentation',
];
modules['libs/data-access-ui/src/lib/crud-list'] = [
  'context:tankos',
  'tankos:layer:presentation',
];
modules['libs/data-access/src/lib/core'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/data-access/src/lib/core/value-types'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/data-access/src/lib/core/errors'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/data-access/src/lib/core/ports'] = [
  'context:tankos',
  'tankos:layer:core',
];
modules['libs/data-access/src/lib/application'] = [
  'context:tankos',
  'tankos:layer:application',
];
modules['libs/data-access/src/lib/adapters'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/data-access/src/lib/adapters/cache'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/data-access/src/lib/adapters/memory'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/data-access/src/lib/composition'] = [
  'context:tankos',
  'tankos:layer:composition',
];
modules['libs/data-access/src/lib/composition/angular'] = [
  'context:tankos',
  'tankos:layer:composition',
];
modules['libs/data-access-firestore/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/data-access-firestore/src/lib/firestore'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/data-access-json-http/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/data-access-json-http/src/lib/json-http'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/data-access-server/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/data-access-server/src/lib/server'] = [
  'context:tankos',
  'tankos:layer:adapter',
];
modules['libs/data-access-firestore-admin/src'] = [
  'context:tankos',
  'tankos:layer:library-root',
];
modules['libs/data-access-firestore-admin/src/lib/firestore-admin'] = [
  'context:tankos',
  'tankos:layer:adapter',
];

export const config: SheriffConfig = {
  entryPoints: {
    veril: './apps/veril/src/main.ts',
  },
  enableBarrelLess: true,
  modules,
  depRules: {
    root: [
      'layer:ui',
      'layer:composition',
      'context:shared',
      'context:composition',
      'context:shells',
    ],
    'context:aquarium-management': [
      'context:aquarium-management',
      'context:shared',
    ],
    'context:care': ['context:care', 'context:shared'],
    'context:measurements': ['context:measurements', 'context:shared'],
    'context:observations': ['context:observations', 'context:shared'],
    'context:timeline': ['context:timeline', 'context:shared'],
    'context:livestock': ['context:livestock', 'context:shared'],
    'context:equipment': ['context:equipment', 'context:shared'],
    'context:maintenance': ['context:maintenance', 'context:shared'],
    'context:species-knowledge': [
      'context:species-knowledge',
      'context:shared',
    ],
    'context:shared-access': ['context:shared-access', 'context:shared'],
    'context:shared': ['context:shared'],
    'context:tankos': ['context:tankos'],
    'tankos:layer:library-root': [
      'tankos:layer:library-root',
      'tankos:layer:core',
      'tankos:layer:application',
      'tankos:layer:adapter',
      'tankos:layer:presentation',
      'context:tankos',
    ],
    'tankos:layer:core': ['tankos:layer:core', 'context:tankos'],
    'tankos:layer:adapter': [
      'tankos:layer:adapter',
      'tankos:layer:core',
      'tankos:layer:library-root',
      'context:tankos',
    ],
    'tankos:layer:application': [
      'tankos:layer:application',
      'tankos:layer:core',
      'context:tankos',
    ],
    'tankos:layer:presentation': [
      'tankos:layer:presentation',
      'tankos:layer:application',
      'tankos:layer:core',
      'context:tankos',
    ],
    'tankos:layer:composition': [
      'tankos:layer:composition',
      'tankos:layer:application',
      'tankos:layer:adapter',
      'tankos:layer:core',
      'context:tankos',
    ],
    'context:composition': [
      'context:composition',
      'context:aquarium-management',
      'context:care',
      'context:measurements',
      'context:observations',
      'context:timeline',
      'context:livestock',
      'context:equipment',
      'context:maintenance',
      'context:species-knowledge',
      'context:shared-access',
      'context:shared',
    ],
    'context:shells': [
      'context:shells',
      'context:aquarium-management',
      'context:care',
      'context:measurements',
      'context:observations',
      'context:timeline',
      'context:livestock',
      'context:equipment',
      'context:maintenance',
      'context:species-knowledge',
      'context:shared',
      'context:composition',
    ],
    'layer:domain': ['layer:domain', 'context:shared'],
    'layer:application': [
      'layer:application',
      'layer:domain',
      'context:shared',
    ],
    'layer:infrastructure': [
      'layer:infrastructure',
      'layer:application',
      'layer:domain',
      'context:shared',
    ],
    'layer:composition': [
      'layer:composition',
      'layer:ui',
      'layer:application',
      'layer:domain',
      'layer:infrastructure',
      'context:shared',
    ],
    'layer:integration': [
      'layer:integration',
      'layer:infrastructure',
      'layer:application',
      'layer:domain',
      'context:shared',
    ],
    'layer:ui': [
      'layer:ui',
      'layer:application',
      'layer:domain',
      'context:shared',
    ],
  },
};
