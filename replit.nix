{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
    pkgs.postgresql
  ];

  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.postgresql
    ];
  };
}