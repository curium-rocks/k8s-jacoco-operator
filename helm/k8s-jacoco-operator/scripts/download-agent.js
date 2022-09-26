const https = require('node:https')
const fs = require('node:fs')
const path = require('node:path')

// https://repo1.maven.org/maven2/org/jacoco/org.jacoco.agent/${ver}/org.jacoco.agent-${ver}.jar

// vars needed
// agent version, download location
const agentVersion = process.env.AGENT_VERSION || '0.8.8'
const downloadDir = process.env.DOWNLOAD_DIR || '/mnt/jacoco'

// check if it's already there
// agent jars will go to ${downloadDir}/${agentVersion}/jacoco.jar
const agentDirPath = path.join(downloadDir, agentVersion)

fs.stat(agentDirPath, (err) => {
  if (!err) {
    console.log('Agent already exists, skipping download')
    return
  }
  fs.mkdir(agentDirPath, {
    recursive: true
  }, (err) => {
    if (err) {
      console.error('Failed to create agent folder: ', err)
      process.exit(1)
      return
    }
    // folder now exists, agent jar does not, lets download it
    const req = https.request({
      hostname: 'repo1.maven.org',
      port: 443,
      path: `maven2/org/jacoco/org.jacoco.agent/${agentVersion}/org.jacoco.agent-${agentVersion}-runtime.jar`
    }, (res) => {
      if (res.statusCode === 200) {
        const jarPath = path.join(downloadDir, agentVersion, 'jacoco.jar')
        const fileStream = fs.createWriteStream(jarPath)
        console.log(`Downloading to ${jarPath}`)
        res.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          console.log('Download complete')
        })
      } else {
        console.error(`Unexpected status code response: ${res.statusCode}`)
        process.exit(2)
      }
    })
    // log errors
    req.on('error', console.error)
    // close the request stream
    req.end()
  })
})
