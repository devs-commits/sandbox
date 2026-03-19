"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContexts";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export default function VerificationPage() {

  const { user } = useAuth();

  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");

  const submit = async () => {

    if (nin.length !== 11) {
      toast.error("NIN must be 11 digits");
      return;
    }

    const res = await fetch("/api/users/identity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user?.id,
        nin,
        bvn
      })
    });

    if (!res.ok) {
      toast.error("Failed to save identity");
      return;
    }

    toast.success("Identity saved successfully");

  };

  return (

    <div className="max-w-lg mx-auto p-6 space-y-4">

      <h2 className="text-xl font-semibold">Identity Verification</h2>

      <input
        className="w-full border p-3 rounded"
        placeholder="Enter your NIN"
        value={nin}
        onChange={(e) => setNin(e.target.value)}
      />

      <input
        className="w-full border p-3 rounded"
        placeholder="Enter your BVN"
        value={bvn}
        onChange={(e) => setBvn(e.target.value)}
      />

      <Button onClick={submit}>
        Submit Identity
      </Button>

    </div>

  );

}