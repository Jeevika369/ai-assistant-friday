export const dsaTools = {
  /**
   * Fetch DSA problem or topic hint
   */
  async get_dsa_challenge({ category = 'DSA', difficulty = 'Medium' }) {
    const problems = {
      DSA: {
        title: 'Two Sum - Target Pair Finder',
        category: 'Arrays & Hash Maps',
        difficulty,
        description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
        hint: 'Use a Hash Map to store complement values (target - current) as you iterate in O(N) time.'
      },
      Python: {
        title: 'Generator Expressions & Memory Efficiency',
        category: 'Core Python',
        difficulty,
        description: 'Explain the difference between list comprehensions and generator expressions when processing a 1GB dataset.',
        hint: 'Generators yield items lazily on demand without storing the full sequence in RAM.'
      }
    };

    const problem = problems[category] || problems.DSA;
    return {
      status: 'success',
      problem,
      message: `Here is your ${difficulty} ${category} challenge: "${problem.title}".`
    };
  }
};
