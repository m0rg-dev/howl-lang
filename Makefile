howl: howl-rs howl-deps howl-java
	cd howl-rs && cargo build
howl-rs:
	cd howl-rs && cargo build
howl-deps:
	mvn dependency:copy-dependencies
howl-java:
	mvn package
clean:
	rm -r howl-rs/target
	mvn clean

.PHONY: howl howl-rs howl-deps howl-java clean
