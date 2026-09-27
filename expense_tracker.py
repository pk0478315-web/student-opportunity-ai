def display_summary(budget, expenses):
    """
    Displays the breakdown of expenses, total spent, remaining balance,
    and a warning if the user went over budget.
    """
    print("\n" + "=" * 25)
    print("     EXPENSE SUMMARY")
    print("=" * 25)

    print("\nExpenses:")
    total_spent = 0
    for expense in expenses:
        print(f"- {expense['name']}: {expense['amount']}")
        total_spent += expense['amount']

    remaining = budget - total_spent

    print(f"\nTotal spent: {total_spent}")
    print(f"Remaining: {remaining}")

    if total_spent > budget:
        print("\nWARNING: You have spent more money than you have!")
    else:
        print("\nGreat job! You stayed within your budget.")


def main():
    # 1. Ask the user for their total budget
    budget = float(input("Enter your budget: "))

    # 2. Ask how many expenses they want to enter
    num_expenses = int(input("How many expenses? "))

    # 3. Store expenses in a list of dictionaries
    expenses = []

    # 4. Loop to collect each expense details
    for _ in range(num_expenses):
        print()
        name = input("Expense: ")
        amount = float(input("Amount: "))
        expenses.append({"name": name, "amount": amount})

    # 5. Display the summary
    display_summary(budget, expenses)


if __name__ == "__main__":
    main()
