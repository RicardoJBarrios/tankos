import noMultipleComparisonsInCondition from './rules/no-multiple-comparisons-in-condition.mjs';

/**
 * Local rules owned by the workspace because no external plugin expresses the
 * exact comparison policy required by TankOS.
 */
export default {
  rules: {
    'no-multiple-comparisons-in-condition': noMultipleComparisonsInCondition,
  },
};
