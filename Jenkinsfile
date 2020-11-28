def targetPath = "/home/jeffrey/dbtc_${BRANCH_NAME}"
pipeline {
	agent any
	triggers {
		pollSCM('H/5 * * * *')
	}
	stages {
		stage ('Installing') {
			steps {
				sh 'npm install'
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
			when {
				expression 	{ fileExists targetPath }
			}
			steps {
				echo "${targetPath}"
				sh "rm -rf "
				sh "rsync -rv ${WORKSPACE}/build ${targetPath}/build"
				sh "rsync -rv ${WORKSPACE}/node_modules ${targetPath}/node_modules"
			}
		}
	}
}