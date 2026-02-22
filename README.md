# COMP0012 Coursework 1

Motivation

I designed this grammar as an imperative, object-oriented scripting language for writing game logic and event-driven state updates. The target use case is the kind of code found in gameplay rules, scripted interactions, and simulation loops: checking conditions, updating variables, branching based on multiple outcomes, and manipulating collections of values.

This motivation shaped the syntax in two ways. Firstly, I prioritised imperative control flow because gameplay is often driven by branching and repeated state changes over time. The language therefore supports if/elif/else, while, for, and switch, giving several ways to formulate game logic. For example, a switch is useful for action or state dispatch while combining initialisation, condition checking, and updates in a single compact header.

Secondly, I wanted concise syntax for collection manipulation, since gameplay elements such as inventories or event histories often operate on arrays. I therefore added typed array declarations and array slicing syntax, including forms such as a[1], a[1:3], and a[::2]. This allows common sequence selection patterns to appear directly in expressions, conditions, and returns, without requiring verbose helper code.

The object-oriented part of the design comes from classes, methods, and optional inheritance, which allow grouping related state and behaviour into reusable units rather than writing all logic as a flat statement list. This is a natural fit for game-like scripting, while keeping the language concise.

I also chose to keep the language typed so that the parser can distinguish key syntactic forms. Supporting typed declarations and typed function definitions introduces a real grammar design challenge because both begin with the same prefix (type identifier), so parser conflict handling and precedence decisions are important parts of the implementation. I also added curried-style function syntax so behaviour logic can be written in staged, reusable forms rather than just as single parameter lists.
 
Implementation

To support a compact imperative, object-oriented scripting language for gameplay and simulation logic, I organised the implementation around a small set of reusable grammar categories: statements, expressions, declarations, and blocks. This keeps the grammar modular while allowing different features to interact in realistic scripts.

1. Statement and block structure (imperative scripting core)

The top-level rule is source_file, which parses a sequence of _statements. A statement can be either:
a compound construct (function_declare, class_declare, if_block, while_block, for_block, switch_block, block), or
a simple statement followed by “;” (declaration, assignment, return, or expression statement).

This design supports the imperative scripting style in the motivation: scripts are primarily built from assignments, conditionals, loops, and explicit block nesting. Requiring braces for blocks also keeps control-flow nesting unambiguous and easier to parse.

2. Typed declarations and the function/declaration ambiguity

A central implementation challenge comes from the typed syntax: both typed declarations and typed function definitions begin with the same prefix:
declaration: int x = 1;
function definition: int f(int x) { ... }

In grammar terms, both start with a type identifier, so Tree-sitter must delay the decision until later tokens. To make this manageable, I unified scalar declarations under a single typed_declare rule rather than separate per-type scalar rules. I then added an explicit Tree-sitter conflict between function_declare_typed and typed_declare, and gave function declarations higher precedence.

3. Expressions and operator precedence (for rule conditions and state updates)

Gameplay logic often mix arithmetic updates (score = score + 1), boolean checks (alive && !stunned), and comparisons (hp < 10). To support this, I split expressions into:
arithmetic_exp
bool_exp
compare_exp
plus identifiers, literals, method calls, and array operations under _expression

Arithmetic expressions use explicit precedence and associativity:
additive (+, -)
multiplicative (*, /, %)
exponentiation (**, right-associative)
unary minus

Boolean expressions support !, &&, and ||, and comparison expressions support ==, !=, <, >, <=, >=.

4. Arrays and slicing (collection manipulation)

Array manipulation is one of the core features motivated by gameplay scripting, so I implemented it in two parts:

(a) Typed array declarations
The grammar supports:
int[], string[], boolean[]

(b) Array indexing/slicing
The array_operation rule supports both indexing and slicing in one syntax family by making start, end, and step optional:
a[1]
a[:]
a[1:3]
a[1:3:2]
a[::2]

5. Control flow for gameplay/event logic

The control-flow constructs (if, while, for, switch) were implemented as separate block-based rules, allowing them to be composed and nested in state-update scripts.
if_block supports repeated elif branches and an optional else
while_block supports looped condition checks
for_block combines initialisation (declare or assignment), condition (bool_exp or compare_exp), and update (assignment)
switch_block supports repeated case branches and an optional default

6. Classes, methods, and curried-style function syntax (OOP scripting structure)

To support the object-oriented part of the language, I implemented class_declare with:
class name
optional extends
optional class parameter list
repeated fields and methods in the class body

Methods reuse the same function declaration rules as top-level functions.

I also included curried-style function/method syntax as an intentional extension. This is implemented by allowing repeated parameter lists in function declarations (repeat1(parameter_list)) and repeated argument lists in method calls (repeat1(argument_list)). As a result, the grammar can parse staged forms such as:
function definition: int f(int x)(int y) { ... }
method call: obj.m(1)(2)
