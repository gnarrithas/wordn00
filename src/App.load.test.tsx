import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

// Its own file: the word lists load once per module, and this test needs them
// unloaded.
test("a failed word list fetch shows an error and can be retried", async () => {
  const fetchMock = vi.fn((url: RequestInfo | URL) =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(String(url).endsWith("solutions.txt") ? "cat\n" : ""),
    } as Response),
  );
  fetchMock.mockImplementationOnce(() =>
    Promise.reject(new TypeError("offline")),
  );
  window.fetch = fetchMock;
  vi.spyOn(console, "error").mockImplementation(() => {});

  render(<App />);
  expect(screen.getByText("Loading words…")).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load the word list",
  );

  fireEvent.click(screen.getByText("Try again"));
  expect(await screen.findByTestId("board")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/words/solutions.txt");
});
