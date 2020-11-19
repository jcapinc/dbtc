pipeline {
	agent any
	stages {
		stage ('Build') {
			steps {
				sh """
				npm install
				npm run test
				npm run build
				"""
			}
		}
	}
}