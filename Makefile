howl: howl-rs howl-deps howl-java

howl-rs:
	cd howl-rs && cargo build
	cp howl-rs/target/debug/howl-rs target/
howl-deps:
	mvn dependency:copy-dependencies
howl-java:
	mvn package
clean:
	rm -r howl-rs/target
	mvn clean

.PHONY: howl howl-rs howl-deps howl-java clean
