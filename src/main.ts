import { getInput, setOutput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    const token = getInput('github_token');
    const octokit = getOctokit(token);
    const { owner, repo } = context.repo;
    const { pull_request: pullRequest } = context.payload;

    if (!pullRequest) {
      throw new Error('This action can only be run on Pull Requests');
    }

    const reviews = await octokit.rest.pulls.listReviews({
      repo,
      owner,
      pull_number: pullRequest.number,
    });

    const reviewers = await octokit.rest.pulls.listRequestedReviewers({
      repo,
      owner,
      pull_number: pullRequest.number,
    });

    console.log(`Reviews: ${JSON.stringify(reviews.data, undefined, 2)}`);
    console.log(`Reviewers: ${JSON.stringify(reviewers.data, undefined, 2)}`);

    if (reviewers.data.users.length > 0 || reviewers.data.teams.length > 0) {
      setFailed('Reviewers are remaining');
      return;
    }

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    setFailed((error as Error)?.message ?? 'Unknown error');
  }
}

run();
