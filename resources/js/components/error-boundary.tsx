import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
    children: ReactNode;
};

type State = {
    error: Error | null;
    componentStack: string | null;
};

/**
 * Renders the actual error instead of a white screen, so runtime crashes
 * stay visible without having to open the browser console.
 */
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null, componentStack: null };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info.componentStack);
        this.setState({ componentStack: info.componentStack ?? null });
    }

    render() {
        const { error, componentStack } = this.state;

        if (!error) {
            return this.props.children;
        }

        return (
            <div className="m-4 max-h-[80vh] overflow-auto rounded-md border border-red-500 bg-red-950/40 p-4 text-sm text-red-100">
                <p className="mb-2 font-semibold">{error.name}: {error.message}</p>
                <pre className="whitespace-pre-wrap text-xs opacity-80">{error.stack}</pre>
                {componentStack && (
                    <pre className="mt-3 whitespace-pre-wrap text-xs opacity-70">{componentStack}</pre>
                )}
                <button
                    type="button"
                    onClick={() => this.setState({ error: null, componentStack: null })}
                    className="mt-4 rounded border border-red-400 px-3 py-1 text-xs"
                >
                    Try again
                </button>
            </div>
        );
    }
}
