export enum Errors {
    NO_CLASS_BODY = 1,
    JUNK_BEFORE_CLASS_BODY = 2,

    EXPECTED_MODULE = 100,
    EXPECTED_EXPRESSION = 101,
    EXPECTED_NAME = 102,
    EXPECTED_TYPE = 103,
    EXPECTED_FUNCTION = 104,
    EXPECTED_THROWS = 105,

    EXPECTED_COMMA = 144,
    EXPECTED_SEMICOLON = 159,
    EXPECTED_EQUALS = 161,
    EXPECTED_OPEN_BRACKET = 191,
    EXPECTED_CLOSE_BRACKET = 193,
    EXPECTED_OPEN_BRACE = 223,
    EXPECTED_CLOSE_BRACE = 225,

    UNEXPECTED_EXPRESSION = 300,

    TYPE_MISMATCH = 400,
    NO_SUCH_FIELD = 401,
    NO_SUCH_MACRO = 402,

    COMPILER_BUG = 9999
}