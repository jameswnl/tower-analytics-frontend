/*global module, process*/

// This is a sample configuration for running the automation-analytics app locally.

// Hack so that Mac OSX docker can sub in host.docker.internal instead of localhost
// see https://docs.docker.com/docker-for-mac/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host
const localhost = (process.env.PLATFORM === 'linux') ? 'localhost' : 'host.docker.internal';

module.exports = {
    routes: {
        '/apps/automation-analytics': { host: `https://${localhost}:8002` },
        '/ansible/automation-analytics': { host: `https://${localhost}:8002` }
    }
};
