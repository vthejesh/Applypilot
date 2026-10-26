def main():
    import sys
    sys.setrecursionlimit(200000)

    def sum_powers(nums, idx):
        if idx >= len(nums):
            return 0
        val = int(nums[idx])
        return (val**4 if val <= 0 else 0) + sum_powers(nums, idx + 1)

    def process_cases(remaining, acc):
        if remaining <= 0:
            return acc
        x_raw = sys.stdin.readline()
        if not x_raw:
            return acc
        y_raw = sys.stdin.readline()

        try:
            x_val = int(x_raw.strip())
            tokens = y_raw.strip().split()
            if len(tokens) != x_val:
                ans = -1
            else:
                ans = sum_powers(tokens, 0)
        except Exception:
            ans = -1

        acc.append(str(ans))
        return process_cases(remaining - 1, acc)

    first_line = sys.stdin.readline()
    if not first_line:
        return
    try:
        n = int(first_line.strip())
        results = process_cases(n, [])
        if results:
            sys.stdout.write('\n'.join(results) + '\n')
    except Exception:
        pass


if __name__ == '__main__':
    main()