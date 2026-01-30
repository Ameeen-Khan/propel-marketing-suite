
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { authApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const activateSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export function ActivateAccountPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    const navigate = useNavigate();
    const { toast } = useToast();
    const { logout } = useAuth();

    useEffect(() => {
        // Logout any existing session to ensure clean activation
        logout();
    }, [logout]);

    useEffect(() => {
        if (!token) {
            toast({
                title: 'Invalid Link',
                description: 'The activation link is missing a token.',
                variant: 'destructive',
            });
            navigate('/login');
        }
    }, [token, navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!token) return;

        // Validate input
        const result = activateSchema.safeParse({ password, confirmPassword });
        if (!result.success) {
            const fieldErrors: { password?: string; confirmPassword?: string } = {};
            result.error.errors.forEach((err) => {
                if (err.path[0] === 'password') fieldErrors.password = err.message;
                if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setIsLoading(true);

        try {
            const response = await authApi.activatePassword(token, password);
            if (response.success) {
                toast({
                    title: 'Account Activated',
                    description: 'Your password has been set. Please log in.',
                });
                navigate('/login');
            } else {
                toast({
                    title: 'Activation Failed',
                    description: response.message || 'Failed to activate account. The link may be expired.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <img src="/logo.png" alt="Propel" className="w-auto h-16 mb-4 object-contain" />
                    <p className="text-muted-foreground mt-1">Marketing Suite</p>
                </div>

                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">Activate Account</CardTitle>
                        <CardDescription>
                            Set your password to activate your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    className={errors.confirmPassword ? 'border-destructive' : ''}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    'Activate Account'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
