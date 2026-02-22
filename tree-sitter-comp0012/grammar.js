module.exports = grammar({
	name: "COMP0012Language",

	extras: ($) => [
		$.comment,
		/\s|\\\r?\n/,
	],
	
	conflicts: ($) => [
		[$.function_declare_typed, $.typed_declare],
	],

	word: ($) => $.identifier,

	rules: {
		source_file: ($) => repeat($._statement),

		block: ($) =>
			seq(
				"{",
				repeat($._statement),
				"}",
			),

		_value: ($) =>
			choice(
				$.bool_exp,
				$.arithmetic_exp,
				$.string,
			),

		argument_list: ($) => seq("(", 
			optional(seq(
			$._expression,
			repeat(seq(",",$._expression),)),
			),
			")"),
		method_call: ($) =>
			seq(
				field("receiver", $.identifier),
				".",
				field("name", $.identifier),
				repeat1($.argument_list),
			),
		
		parameter: ($) => seq($.type, $.identifier),
		parameter_list: ($) => seq("(", 
			optional(seq(
			$.parameter,
			repeat(seq(",",$.parameter),)),
			),
			")"),
		_expression: ($) =>
			prec(10, choice(
				$._value,
				$.identifier,
				$.method_call,
				$.array_operation,
				$.compare_exp,
			)),
		
		type: (_$) => choice("int", "string", "boolean",),
		type_void: (_$) => choice("void","var",),
		int_array_declare: ($) => seq(
			"int",
			"[]",
			field("name", $.identifier),
			optional(
				seq(
					"=",
					"[",
					field("value",optional(seq($.arithmetic_exp,repeat(seq(",",$.arithmetic_exp))))),
					"]",
				),
			),
		),
		string_array_declare: ($) => seq(
			"string",
			"[]",
			field("name", $.identifier),
			optional(
				seq(
					"=",
					"[",
					field("value",optional(seq($.string,repeat(seq(",",$.string))))),
					"]",
				),
			),
		),
		bool_array_declare: ($) => seq(
			"boolean",
			"[]",
			field("name", $.identifier),
			optional(
				seq(
					"=",
					"[",
					field("value",optional(seq($.bool_exp,repeat(seq(",",$.bool_exp))))),
					"]",
				),
			),
		),
		array_declare: ($) => prec(2, choice(
			$.int_array_declare,
			$.bool_array_declare,
			$.string_array_declare,
		)),
		typed_declare: ($) => prec(25, seq(
			field("decl_type", $.type),
			field("name", $.identifier),
			"=",
			field("value", $._value),
		)),
		
		declare:($) =>
			choice(
				$.array_declare,
				$.typed_declare,
			),
		assignment: ($) =>
			seq(field("name", $.identifier), "=", field("value", $._value)),

		_statement: ($) => choice(
			$.function_declare,
			$.class_declare,
			$.if_block,
			$.while_block,
			$.for_block,
			$.switch_block,
			$.block,
			seq($._simple_statement, ";"),
		),


		_simple_statement: ($) => choice(
			$.declare,
			$.assignment,
			$.return_statement,
			$._expression,
		),

		_newline: (_$) => /\s*\n/,
		keyword: (_$) => choice(
			"if", "elif", "else", "for", "while", "switch", "case", "default", "class", "extends", "return", "int", "string", "boolean", "void", "var", "true", "false","return"
		),
		identifier: (_$) => token(prec(-1, /[A-Za-z_][A-Za-z0-9_]*/)),
		bool: (_$) => choice("true", "false"),
		num: (_$) => /[0-9]+/,
		string: (_$) => seq('"', /[^"]+/, '"'),

		bool_exp: ($) => prec(9, choice(
			$.bool,
			$.parenthesis_bool,
			$.identifier,
			$.unary_bool,
			$.binary_bool,
			$.compare_exp,
		)),
		parenthesis_bool: ($) => seq("(", $.bool_exp, ")"),
		unary_bool: ($) => prec(3, seq("!", $.bool_exp)),
		binary_bool: ($) =>
			choice(
				prec.left(2,seq($.bool_exp, "&&", $.bool_exp)),
				prec.left(1,seq($.bool_exp, "||", $.bool_exp)),
			),

		arithmetic: (_$) => choice("+","-","*","/","**","%"),
		arithmetic_exp: ($) => prec(8, choice(
			$.num,
			$.binary_arithmetic,
			$.identifier,
			$.unary_arithmetic,
			$.parenthesis_arithmetic,
		)),
		binary_arithmetic: ($) => choice(
			prec.left(4, seq($.arithmetic_exp, choice("+", "-"), $.arithmetic_exp)),
			prec.left(5, seq($.arithmetic_exp, choice("*", "/", "%"), $.arithmetic_exp)),
			prec.right(6, seq($.arithmetic_exp, "**", $.arithmetic_exp)),
		),
		unary_arithmetic: ($) => prec(7,seq("-",$.arithmetic_exp)),
		parenthesis_arithmetic: ($) => seq("(",$.arithmetic_exp,")",),

		_compare_operand: ($) => choice(
			$.identifier,
			$.string,
			$.arithmetic_exp,
			$.bool,
			$.array_operation,
			$.method_call
		),
		compare: (_$) => choice("==",">","<",">=","<=","!=",),
		compare_exp: ($) => choice($.binary_compare,$.parenthesis_compare),
		binary_compare: ($) => prec.left(seq($._compare_operand, $.compare, $._compare_operand,)),
		parenthesis_compare: ($) => seq("(",$.compare_exp,")",),

		if_block: ($) => seq(
			"if",
			"(",
			field("condition", choice(
				$.bool_exp,
				$.compare_exp,
			)),
			")",
			field("if_block", $.block),
			repeat(seq(
				"elif",
				"(",
				field("condition", choice(
					$.bool_exp,
					$.compare_exp,
				)),
				")",
				field("elif_block", $.block),
			),),
			optional(seq(
				"else",
				field("else_block", $.block),
				),
			),
		),

		while_block: ($) => seq(
			"while",
			"(",
			field("condition", choice(
				$.bool_exp,
				$.compare_exp,
			)),
			")",
			$.block,
		),

		for_block: ($) => seq(
			"for",
			"(",
			field("initialization", choice(
				$.declare,
				$.assignment,
			)),
			";",
			field("condition", choice(
				$.bool_exp,
				$.compare_exp,
			)),
			";",
			field("update", $.assignment),
			")",
			$.block,
		),

		switch_block: ($) => seq(
			"switch",
			"(",
			field("value", $.identifier),
			")",
			"{",
			repeat(
				seq(
					"case",
					field("label", $._expression),
					"->",
					field("body", $.block),
				),
			),
			optional(seq(
				"default",
				"->",
				field("body", $.block),
			),),
			"}",
		),

		// http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
		comment: (_$) =>
			token(choice(
				seq("//", /(\\(.|\r?\n)|[^\\\n])*/),
				seq(
					"/*",
					/[^*]*\*+([^/*][^*]*\*+)*/,
					"/",
				),
			)),
		return_statement: ($) => seq(
			"return",
			optional($._expression)
		),
		
		function_declare_typed: ($) => prec(30, seq(
			field("return_type", $.type),
			field("name", $.identifier),
			repeat1(field("params", $.parameter_list)),
			field("body", $.block),
		)),

		function_declare_void: ($) => prec(30, seq(
			field("return_type", $.type_void),
			field("name", $.identifier),
			repeat1(field("params", $.parameter_list)),
			field("body", $.block),
		)),

		function_declare: ($) => choice(
			$.function_declare_typed,
			$.function_declare_void,
		),

		array_operation: ($) => seq(
			field("array", $.identifier),
			"[",
			optional(field("start", $.arithmetic_exp)),
			optional(seq(
				":",
				optional(field("end", $.arithmetic_exp)),
				optional(seq(":", optional(field("step", $.arithmetic_exp))))
			)),
			"]"
		),

		class_declare: ($) => seq(
			"class",
			field("name", $.identifier),
			optional(seq("extends", field("superclass", $.identifier))),
			optional(field("parameter", $.parameter_list)),
			"{",
			repeat(seq(
				choice(
				seq(field("field", $.declare),";"),
				field("method", $.function_declare),
				))),
			"}",
		),
	},
});
