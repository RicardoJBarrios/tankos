/**
 * Returns the single return or throw statement guarded by an if statement.
 *
 * @param {object} statement - Statement to inspect.
 * @returns {object | null} The guarded return statement, when applicable.
 */
function guardedExit(statement) {
  if (statement.type !== 'IfStatement' || statement.alternate !== null) {
    return null;
  }

  const consequent =
    statement.consequent.type === 'BlockStatement' &&
    statement.consequent.body.length === 1
      ? statement.consequent.body[0]
      : statement.consequent;
  if (
    consequent.type !== 'ReturnStatement' &&
    consequent.type !== 'ThrowStatement'
  ) {
    return null;
  }
  return consequent;
}

/**
 * Returns the comparable outcome of a guarded exit.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint rule context.
 * @param {object} exit - Guarded return or throw statement.
 * @returns {string} Exit type and expression used as the comparison key.
 */
function exitKey(context, exit) {
  return `${exit.type}:${context.sourceCode.getText(exit.argument)}`;
}

/**
 * Reports consecutive guards that exit with the same expression.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint rule context.
 * @param {object[]} statements - Statements in one lexical block.
 * @returns {void}
 */
function reportRepeatedGuards(context, statements) {
  let previousExit = null;
  let repeatedCount = 0;

  for (const statement of statements) {
    const currentExit = guardedExit(statement);
    if (currentExit === null) {
      previousExit = null;
      repeatedCount = 0;
      continue;
    }

    const currentText = exitKey(context, currentExit);
    const previousText =
      previousExit === null ? null : exitKey(context, previousExit);
    if (currentText !== previousText) {
      previousExit = currentExit;
      repeatedCount = 1;
      continue;
    }

    repeatedCount += 1;
    if (repeatedCount === 2) {
      context.report({
        node: statement,
        messageId: 'sameReturnGuards',
      });
    }
    previousExit = currentExit;
  }
}

/**
 * Creates listeners for the repeated-return guard rule.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint rule context.
 * @returns {import('eslint').Rule.RuleListener} Rule listeners.
 */
function createRule(context) {
  return {
    Program: (node) => reportRepeatedGuards(context, node.body),
    BlockStatement: (node) => reportRepeatedGuards(context, node.body),
  };
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow consecutive conditional guards with the same return or throw outcome.',
    },
    schema: [],
    messages: {
      sameReturnGuards:
        'Combine consecutive guards with the same return or throw value into one named predicate.',
    },
  },
  create: createRule,
};
