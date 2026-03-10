const core = require('@actions/core')
const path = require('path')
const fs = require('fs')

/**
 * Requires a script after validating it resides within the workspace.
 *
 * @param file
 */
module.exports = (file) => {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd()
  const fileLocation = path.resolve(workspace, file)
  const resolvedWorkspace = fs.realpathSync(workspace)

  // Ensure the resolved path is within the workspace to prevent path traversal
  if (!fileLocation.startsWith(resolvedWorkspace + path.sep) && fileLocation !== resolvedWorkspace) {
    core.error(`Script path "${file}" resolves to "${fileLocation}" which is outside the workspace "${resolvedWorkspace}"`)
    return undefined
  }

  // Double check the script exists before loading it
  if (fs.existsSync(fileLocation)) {
    core.info(`Loading "${fileLocation}" script`)

    return require(fileLocation)
  }

  core.error(`Tried to load "${fileLocation}" script but it does not exist!`)

  return undefined
}
