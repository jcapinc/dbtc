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
			steps {
				sh 'cp -rv ${WORKSPACE}/build /home/jeffrey/dbtc_master/'
			}
		}
	}
}