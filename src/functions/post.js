import * as core from '@actions/core'
import {contextCheck} from './context-check'
import {checkInput} from './check-input'
import {postDeploy} from './post-deploy'
import * as github from '@actions/github'
import {context} from '@actions/github'

export async function post() {
  try {
    const ref = core.getState('ref')
    const comment_id = core.getState('comment_id')
    const reaction_id = core.getState('reaction_id')
    const noop = core.getState('noop') === 'true'
    const deployment_id = core.getState('deployment_id')
    const environment = core.getState('environment')
    const environment_url = await checkInput(core.getState('environment_url'))
    const token = core.getState('actionsToken')
    const bypass = core.getState('bypass') === 'true'
    const status = core.getInput('status')
    const skip_completing = core.getInput('skip_completing') === 'true'

    // If bypass is set, exit the workflow
    if (bypass) {
      core.warning('bypass set, exiting')
      return
    }

    // Check the context of the event to ensure it is valid, return if it is not
    if (!(await contextCheck(context))) {
      return
    }

    // Skip the process of completing a deployment, return
    if (skip_completing) {
      core.info('skip_completing set, exiting')
      return
    }

    // Create an octokit client
    const octokit = github.getOctokit(token)

    // Set the environment_url
    if (environment_url === null) {
      core.debug('environment_url not set, its value is null')
    }

    await postDeploy(
      context,
      octokit,
      comment_id,
      reaction_id,
      status,
      ref,
      noop,
      deployment_id,
      environment,
      environment_url
    )

    return
  } catch (error) {
    core.error(error.stack)
    core.setFailed(error.message)
  }
}
