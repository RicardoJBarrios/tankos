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
modules['apps/tank-os/src'] = ['context:tank-os', 'tank-os:layer:composition'];
modules['apps/tank-os/src/app'] = [
  'context:tank-os',
  'tank-os:layer:composition',
];

for (const layer of layers) {
  modules[`apps/veril/src/app/shared-access/${layer}`] = [
    'context:shared-access',
    `layer:${layer}`,
  ];
}

const tankOsTimeLayers: Record<string, string[]> = {
  'libs/tank-os/time/src': ['context:tank-os', 'tank-os:layer:library-root'],
  'libs/tank-os/time/src/lib/time': [
    'context:tank-os',
    'tank-os:layer:library-root',
  ],
  'libs/tank-os/time/src/lib/time/core': [
    'context:tank-os',
    'tank-os:layer:core',
  ],
  'libs/tank-os/time/src/lib/time/core/ports': [
    'context:tank-os',
    'tank-os:layer:core',
  ],
  'libs/tank-os/time/src/lib/time/core/value-types': [
    'context:tank-os',
    'tank-os:layer:core',
  ],
  'libs/tank-os/time/src/lib/time/core/validation': [
    'context:tank-os',
    'tank-os:layer:core',
  ],
  'libs/tank-os/time/src/lib/time/application': [
    'context:tank-os',
    'tank-os:layer:application',
  ],
  'libs/tank-os/time/src/lib/time/composition': [
    'context:tank-os',
    'tank-os:layer:composition',
  ],
  'libs/tank-os/time/src/lib/time/composition/angular': [
    'context:tank-os',
    'tank-os:layer:composition',
  ],
  'libs/tank-os/time/src/lib/time/adapters': [
    'context:tank-os',
    'tank-os:layer:adapter',
  ],
  'libs/tank-os/time/src/lib/time/adapters/angular': [
    'context:tank-os',
    'tank-os:layer:adapter',
  ],
  'libs/tank-os/time/src/lib/time/adapters/native': [
    'context:tank-os',
    'tank-os:layer:adapter',
  ],
  'libs/tank-os/time/src/lib/time/presentation': [
    'context:tank-os',
    'tank-os:layer:presentation',
  ],
  'libs/tank-os/time/src/lib/time/presentation/pipes': [
    'context:tank-os',
    'tank-os:layer:presentation',
  ],
};

Object.assign(modules, tankOsTimeLayers);

modules['libs/tank-os/units/src/lib/units'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/units/src'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/units/src/lib/units/core'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/units/src/lib/units/core/value-types'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/units/src/lib/units/core/errors'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/units/src/lib/units/core/ports'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/units/src/lib/units/adapters'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/units/src/lib/units/adapters/standard'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/units/src/lib/units/application'] = [
  'context:tank-os',
  'tank-os:layer:application',
];
modules['libs/tank-os/units/src/lib/units/composition'] = [
  'context:tank-os',
  'tank-os:layer:composition',
];
modules['libs/tank-os/units/src/lib/units/composition/standard'] = [
  'context:tank-os',
  'tank-os:layer:composition',
];
modules['libs/tank-os/decimal/src/lib/decimal'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/decimal/src'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/decimal/src/lib/decimal/core'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/decimal/src/lib/decimal/core/value-types'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/decimal/src/lib/decimal/core/errors'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/decimal/src/lib/decimal/core/ports'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/decimal/src/lib/decimal/application'] = [
  'context:tank-os',
  'tank-os:layer:application',
];
modules['libs/tank-os/decimal/src/lib/decimal/adapters'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/decimal/src/lib/decimal/composition'] = [
  'context:tank-os',
  'tank-os:layer:composition',
];
modules['libs/tank-os/decimal/src/lib/decimal/composition/angular'] = [
  'context:tank-os',
  'tank-os:layer:composition',
];
for (const adapterPackage of [
  'time-firestore',
  'time-json-http',
  'time-zod',
  'decimal-big-js',
  'decimal-zod',
]) {
  modules[`libs/tank-os/${adapterPackage}/src`] = [
    'context:tank-os',
    'tank-os:layer:library-root',
  ];
  modules[`libs/tank-os/${adapterPackage}/src/lib`] = [
    'context:tank-os',
    'tank-os:layer:adapter',
  ];
}
modules['libs/tank-os/time-firestore/src/lib/firestore'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/time-json-http/src/lib/json-http'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/time-zod/src/lib/zod'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/decimal-big-js/src/lib/big-js'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/decimal-zod/src/lib/zod'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/data-access/src'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/data-access/src/lib/core'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/data-access/src/lib/core/value-types'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/data-access/src/lib/core/errors'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/data-access/src/lib/core/ports'] = [
  'context:tank-os',
  'tank-os:layer:core',
];
modules['libs/tank-os/data-access/src/lib/application'] = [
  'context:tank-os',
  'tank-os:layer:application',
];
modules['libs/tank-os/data-access/src/lib/adapters'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/data-access/src/lib/adapters/cache'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/data-access/src/lib/adapters/memory'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/data-access/src/lib/composition'] = [
  'context:tank-os',
  'tank-os:layer:composition',
];
modules['libs/tank-os/data-access/src/lib/composition/angular'] = [
  'context:tank-os',
  'tank-os:layer:composition',
];
modules['libs/tank-os/data-access-firestore/src'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/data-access-firestore/src/lib/firestore'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/data-access-json-http/src'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/data-access-json-http/src/lib/json-http'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/data-access-server/src'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/data-access-server/src/lib/server'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
];
modules['libs/tank-os/data-access-firestore-admin/src'] = [
  'context:tank-os',
  'tank-os:layer:library-root',
];
modules['libs/tank-os/data-access-firestore-admin/src/lib/firestore-admin'] = [
  'context:tank-os',
  'tank-os:layer:adapter',
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
    'context:tank-os': ['context:tank-os'],
    'tank-os:layer:library-root': [
      'tank-os:layer:library-root',
      'tank-os:layer:core',
      'tank-os:layer:application',
      'tank-os:layer:adapter',
      'tank-os:layer:presentation',
      'context:tank-os',
    ],
    'tank-os:layer:core': ['tank-os:layer:core', 'context:tank-os'],
    'tank-os:layer:adapter': [
      'tank-os:layer:adapter',
      'tank-os:layer:core',
      'tank-os:layer:library-root',
      'context:tank-os',
    ],
    'tank-os:layer:application': [
      'tank-os:layer:application',
      'tank-os:layer:core',
      'context:tank-os',
    ],
    'tank-os:layer:presentation': [
      'tank-os:layer:presentation',
      'tank-os:layer:application',
      'tank-os:layer:core',
      'context:tank-os',
    ],
    'tank-os:layer:composition': [
      'tank-os:layer:composition',
      'tank-os:layer:application',
      'tank-os:layer:adapter',
      'tank-os:layer:core',
      'context:tank-os',
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
