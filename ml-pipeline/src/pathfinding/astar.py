def a_star_search(start, goal):
    \"\"\"
    Demo A* pathfinding algorithm for Lunar rover trajectory.
    Returns a mocked path.
    \"\"\"
    print(f"Calculating path from {start} to {goal} avoiding lunar craters...")
    # Mocked path
    return [start, (start[0]+1, start[1]+1), goal]

if __name__ == "__main__":
    path = a_star_search((0,0), (10,10))
    print("Found path:", path)
