pipeline {
	agent any
	triggers {
		pollSCM('H/5 * * * *')
	}
	stages {
		stage ('Installing') {
			steps {
				sh "npm install"
			}
		}
		stage ('Tests') {
			steps {
				sh 'npm run test'
			}
		}
		stage ('Build') {
			steps {
				sh 'npm run build'
			}
		}
		stage ('Deliver') {
			def targetPath = "/home/jeffrey/dbtc_${BRANCH_NAME}"
			def exists = fileExists targetPath
			steps {
				if (exists) {
					sh 'cp -rv ${WORKSPACE}/build ${targetPath}/build'
					sh 'cp -rv ${WORKSPACE}/node_modules ${targetPath}/node_modules'
				}
				else {
					echo 'No target directory to build into, skipping'
				}
			}
		}
	}
}