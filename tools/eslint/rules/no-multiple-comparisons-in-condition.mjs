const DEFAULT_MAX_CONDITION_TERMS = 2;

/**
 * Counts atomic terms in a logical condition.
 *
 * @param {object | null | undefined} node - AST node to inspect.
 * @returns {number} Number of atomic condition terms below the node.
 */
function countConditionTerms(node) {
  if (node === null || node === undefined || typeof node !== 'object') {
    return 0;
  }

  if (node.type !== 'LogicalExpression') {
    return 1;
  }

  return countConditionTerms(node.left) + countConditionTerms(node.right);
}

/**
 * Creates the rule that keeps multi-term conditions explicit and named.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint rule context.
 * @param {object | null | undefined} test - Conditional test to inspect.
 * @param {number} maxConditionTerms - Maximum allowed condition terms.
 * @returns {void}
 */
function reportIfNecessary(context, test, maxConditionTerms) {
  const conditionTermCount = countConditionTerms(test);
  if (conditionTermCount > maxConditionTerms) {
    context.report({
      node: test,
      messageId: 'multipleComparisons',
      data: { maxConditionTerms },
    });
  }
}

/**
 * Creates the rule listeners.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint rule context.
 * @returns {import('eslint').Rule.RuleListener} Rule listeners.
 */
function createRule(context) {
  const [{ maxConditionTerms = DEFAULT_MAX_CONDITION_TERMS } = {}] =
    context.options;

  return {
    IfStatement: (node) =>
      reportIfNecessary(context, node.test, maxConditionTerms),
    WhileStatement: (node) =>
      reportIfNecessary(context, node.test, maxConditionTerms),
    DoWhileStatement: (node) =>
      reportIfNecessary(context, node.test, maxConditionTerms),
    ForStatement: (node) =>
      reportIfNecessary(context, node.test, maxConditionTerms),
    ConditionalExpression: (node) =>
      reportIfNecessary(context, node.test, maxConditionTerms),
  };
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow more than the configured number of atomic terms in one conditional test.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxConditionTerms: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      multipleComparisons:
        'Extract more than {{maxConditionTerms}} condition terms into a named predicate or comparator.',
    },
  },
  create: createRule,
};
