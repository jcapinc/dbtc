pipeline {
	agent any
	stages {
		stage ('Installing') {
			steps {
				sh "npm install"
			}
		}
		stage ('Test') {
			steps {
				sh "npm run test"
			}
		}
		stage ('Build') {
			steps {
				sh "npm run build"
			}
		}
	}
}