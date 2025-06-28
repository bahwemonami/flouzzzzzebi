import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function UserSelection() {
  const { users, selectUser, account } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const handleSelectUser = async () => {
    if (selectedUserId) {
      selectUser.mutate(selectedUserId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Choisissez votre nom
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Connecté en tant que: {account?.email}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedUserId === user.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${!user.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!user.isActive}
              >
                <div className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                {!user.isActive && (
                  <div className="text-sm text-red-500 mt-1">
                    Compte désactivé
                  </div>
                )}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSelectUser}
            disabled={!selectedUserId || selectUser.isPending}
            className="w-full"
          >
            {selectUser.isPending ? "Connexion..." : "Continuer"}
          </Button>

          {users.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Aucun employé configuré pour ce compte.
              <br />
              Contactez votre administrateur.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}