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

modules['libs/tank-os/time'] = ['context:tank-os'];
modules['libs/tank-os/units'] = ['context:tank-os'];

for (const modulePath of [
  'libs/tank-os/time/src',
  'libs/tank-os/time/src/lib/time',
  'libs/tank-os/time/src/lib/time/core',
  'libs/tank-os/time/src/lib/time/core/ports',
  'libs/tank-os/time/src/lib/time/core/value-types',
  'libs/tank-os/time/src/lib/time/core/validation',
  'libs/tank-os/time/src/lib/time/adapters',
  'libs/tank-os/time/src/lib/time/adapters/angular',
  'libs/tank-os/time/src/lib/time/adapters/firestore',
  'libs/tank-os/time/src/lib/time/adapters/json-http',
  'libs/tank-os/time/src/lib/time/adapters/native',
  'libs/tank-os/time/src/lib/time/application',
  'libs/tank-os/time/src/lib/time/presentation',
  'libs/tank-os/time/src/lib/time/presentation/pipes',
  'libs/tank-os/units/src',
]) {
  modules[modulePath] = ['context:tank-os'];
}

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
  'libs/tank-os/time/src/lib/time/adapters/firestore': [
    'context:tank-os',
    'tank-os:layer:adapter',
  ],
  'libs/tank-os/time/src/lib/time/adapters/json-http': [
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
      'context:tank-os',
    ],
    'tank-os:layer:application': [
      'tank-os:layer:application',
      'tank-os:layer:adapter',
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
