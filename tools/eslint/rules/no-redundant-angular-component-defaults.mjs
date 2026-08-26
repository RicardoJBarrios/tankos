/**
 * Disallows Angular component metadata that repeats Angular 22 defaults.
 *
 * Angular 22 components are standalone and use OnPush by default. Explicitly
 * writing those values adds noise and can make the project policy drift from
 * the framework default.
 */
export default {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Disallow redundant standalone and OnPush component metadata in Angular 22.',
    },
    schema: [],
    messages: {
      standalone:
        'Remove standalone: true; Angular 22 components are standalone by default.',
      changeDetection:
        'Remove changeDetection: ChangeDetectionStrategy.OnPush; Angular 22 uses OnPush by default.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    function removeMetadataProperties(metadata, properties) {
      const redundant = new Set(properties);
      const remaining = metadata.properties.filter(
        (property) => !redundant.has(property),
      );
      const replacement =
        remaining.length === 0
          ? '{}'
          : `{ ${remaining
              .map((property) => sourceCode.getText(property))
              .join(', ')} }`;
      return (fixer) => fixer.replaceText(metadata, replacement);
    }

    return {
      Decorator(node) {
        if (
          node.expression.type !== 'CallExpression' ||
          node.expression.callee.type !== 'Identifier' ||
          node.expression.callee.name !== 'Component'
        ) {
          return;
        }

        const metadata = node.expression.arguments[0];
        if (metadata?.type !== 'ObjectExpression') {
          return;
        }

        const redundantProperties = [];
        for (const property of metadata.properties) {
          if (
            property.type !== 'Property' ||
            property.key.type !== 'Identifier'
          ) {
            continue;
          }

          if (
            property.key.name === 'standalone' &&
            property.value.type === 'Literal' &&
            property.value.value === true
          ) {
            redundantProperties.push({ property, messageId: 'standalone' });
          }

          if (
            property.key.name === 'changeDetection' &&
            property.value.type === 'MemberExpression' &&
            property.value.object.type === 'Identifier' &&
            property.value.object.name === 'ChangeDetectionStrategy' &&
            property.value.property.type === 'Identifier' &&
            property.value.property.name === 'OnPush'
          ) {
            redundantProperties.push({
              property,
              messageId: 'changeDetection',
            });
          }
        }

        redundantProperties.forEach(({ property, messageId }, index) => {
          context.report({
            node: property,
            messageId,
            fix:
              index === 0
                ? removeMetadataProperties(
                    metadata,
                    redundantProperties.map(({ property: item }) => item),
                  )
                : undefined,
          });
        });
      },
    };
  },
};
